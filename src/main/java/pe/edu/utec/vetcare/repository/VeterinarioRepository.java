package pe.edu.utec.vetcare.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.utec.vetcare.entity.VeterinarioEntity;

public interface VeterinarioRepository extends JpaRepository<VeterinarioEntity, Long> {
    boolean existsByUsuario_IdUsuario(Long idUsuario);
    java.util.Optional<VeterinarioEntity> findByUsuario_IdUsuario(Long idUsuario);
    boolean existsByNroColegiatura(String nroColegiatura);
}