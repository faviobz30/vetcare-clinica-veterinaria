package pe.edu.utec.vetcare.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pe.edu.utec.vetcare.entity.CitaEntity;
import pe.edu.utec.vetcare.enums.EstadoCita;

import java.time.LocalDateTime;
import java.util.List;

public interface CitaRepository extends JpaRepository<CitaEntity, Long> {

    boolean existsByMascota_IdMascota(Long idMascota);

    boolean existsByMascota_IdMascotaAndVeterinario_Usuario_Correo(Long idMascota, String correo);


    @Query("SELECT c FROM CitaEntity c WHERE c.veterinario.usuario.correo = :correo")
    List<CitaEntity> findByCorreoVeterinario(@Param("correo") String correo);

    @Query("SELECT c FROM CitaEntity c WHERE c.mascota.propietario.usuario.correo = :correo")
    List<CitaEntity> findByCorreoPropietario(@Param("correo") String correo);


    @Query("""
        SELECT COUNT(c) > 0
        FROM CitaEntity c
        WHERE c.veterinario.idVeterinario = :idVeterinario
        AND c.fechaCita < :finNuevaCita
        AND c.fechaCita > :inicioComparacion
        AND c.estado <> :estadoExcluido
    """)
    boolean existsCitaSuperpuesta(
            @Param("idVeterinario") Long idVeterinario,
            @Param("inicioComparacion") LocalDateTime inicioComparacion,
            @Param("finNuevaCita") LocalDateTime finNuevaCita,
            @Param("estadoExcluido") EstadoCita estadoExcluido
    );

    // Al reprogramar, no comparar la cita con ella misma.
    @Query("""
        SELECT COUNT(c) > 0
        FROM CitaEntity c
        WHERE c.veterinario.idVeterinario = :idVeterinario
        AND c.fechaCita < :finNuevaCita
        AND c.fechaCita > :inicioComparacion
        AND c.estado <> :estadoExcluido
        AND c.idCita <> :idCitaActual
    """)
    boolean existsOtraCitaSuperpuesta(
            @Param("idVeterinario") Long idVeterinario,
            @Param("inicioComparacion") LocalDateTime inicioComparacion,
            @Param("finNuevaCita") LocalDateTime finNuevaCita,
            @Param("estadoExcluido") EstadoCita estadoExcluido,
            @Param("idCitaActual") Long idCitaActual
    );
}