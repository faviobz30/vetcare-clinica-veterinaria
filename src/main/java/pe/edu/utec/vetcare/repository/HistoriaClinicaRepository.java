package pe.edu.utec.vetcare.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.utec.vetcare.entity.HistoriaClinicaEntity;

import java.util.Optional;

public interface HistoriaClinicaRepository
        extends JpaRepository<HistoriaClinicaEntity, Long> {

    Optional<HistoriaClinicaEntity> findByMascotaIdMascota(Long idMascota);
}